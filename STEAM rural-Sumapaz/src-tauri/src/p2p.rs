use std::io::{Read, Write};
use std::net::{IpAddr, SocketAddr, TcpListener, TcpStream, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

static RUNNING: AtomicBool = AtomicBool::new(false);

const P2P_PORT: u16 = 4545;
const MAX_REQUEST_BYTES: usize = 4096;
/// Tras este número de intentos fallidos el emisor se apaga y hay que generar un código nuevo.
const MAX_FAILED_ATTEMPTS: u32 = 5;

/// Valida que la petición traiga exactamente una cabecera `x-steam-pin` con el código esperado.
fn pin_valido(request: &str, expected: &str) -> bool {
    let mut valores = request
        .split("\r\n")
        .skip(1)
        .take_while(|linea| !linea.is_empty())
        .filter_map(|linea| linea.split_once(':'))
        .filter(|(nombre, _)| nombre.trim().eq_ignore_ascii_case("x-steam-pin"))
        .map(|(_, valor)| valor.trim());

    match (valores.next(), valores.next()) {
        (Some(valor), None) => !expected.is_empty() && valor == expected,
        _ => false,
    }
}

/// Lee las cabeceras de la petición, aunque lleguen en varios paquetes.
fn leer_peticion(stream: &mut TcpStream) -> Option<String> {
    let mut peticion = Vec::new();
    let mut buffer = [0u8; 1024];
    while peticion.len() < MAX_REQUEST_BYTES {
        let leidos = stream.read(&mut buffer).ok()?;
        if leidos == 0 {
            break;
        }
        peticion.extend_from_slice(&buffer[..leidos]);
        if peticion.windows(4).any(|fin| fin == b"\r\n\r\n") {
            return Some(String::from_utf8_lossy(&peticion).into_owned());
        }
    }
    None
}

/// Extrae el cuerpo de la respuesta y comprueba que llegó completo.
fn interpretar_respuesta(respuesta: &[u8]) -> Result<String, String> {
    let fin_cabeceras = respuesta
        .windows(4)
        .position(|fin| fin == b"\r\n\r\n")
        .ok_or_else(|| "El equipo emisor cerró la conexión sin responder. Genera un código nuevo e inténtalo otra vez.".to_string())?;

    let cabeceras = String::from_utf8_lossy(&respuesta[..fin_cabeceras]);
    let estado = cabeceras.lines().next().unwrap_or_default();
    if estado.contains(" 403 ") {
        return Err("El código ingresado no coincide con el del equipo emisor.".to_string());
    }
    if !estado.contains(" 200 ") {
        return Err("Respuesta no válida del equipo emisor".to_string());
    }

    let cuerpo = &respuesta[fin_cabeceras + 4..];
    let longitud = cabeceras
        .lines()
        .filter_map(|linea| linea.split_once(':'))
        .find(|(nombre, _)| nombre.trim().eq_ignore_ascii_case("content-length"))
        .and_then(|(_, valor)| valor.trim().parse::<usize>().ok())
        .ok_or_else(|| "Respuesta no válida del equipo emisor".to_string())?;
    if cuerpo.len() != longitud {
        return Err(format!(
            "La transferencia quedó incompleta: se recibieron {} de {} bytes.",
            cuerpo.len(),
            longitud
        ));
    }

    String::from_utf8(cuerpo.to_vec()).map_err(|_| "Los datos recibidos no son válidos".to_string())
}

/// Obtiene la dirección IP local de este computador en la red WiFi o LAN
#[tauri::command]
pub fn get_local_ip() -> Result<String, String> {
    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
    socket
        .connect("8.8.8.8:80")
        .map_err(|_e| "No se pudo detectar red local conectada".to_string())?;
    let local_addr = socket.local_addr().map_err(|e| e.to_string())?;
    Ok(local_addr.ip().to_string())
}

/// Inicia el servidor emisor temporal en el puerto 4545
#[tauri::command]
pub fn start_p2p_host(pin: String, json_data: String) -> Result<String, String> {
    if pin.trim().is_empty() {
        return Err("Falta el código de seguridad".to_string());
    }

    RUNNING.store(false, Ordering::SeqCst);
    thread::sleep(Duration::from_millis(150));

    let local_ip = match get_local_ip() {
        Ok(ip) => ip,
        Err(_) => "127.0.0.1".to_string(),
    };

    let bind_addr = format!("0.0.0.0:{}", P2P_PORT);
    let listener = TcpListener::bind(&bind_addr).map_err(|e| format!("Error enlazando puerto 4545: {}", e))?;
    listener
        .set_nonblocking(true)
        .map_err(|e| e.to_string())?;

    RUNNING.store(true, Ordering::SeqCst);
    let expected_pin = pin.trim().to_string();

    thread::spawn(move || {
        let mut intentos_fallidos = 0u32;
        while RUNNING.load(Ordering::SeqCst) {
            match listener.accept() {
                Ok((mut stream, _addr)) => {
                    // En Windows la conexión aceptada hereda el modo no bloqueante del listener.
                    if stream.set_nonblocking(false).is_err() {
                        continue;
                    }
                    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
                    let _ = stream.set_write_timeout(Some(Duration::from_secs(10)));

                    if let Some(peticion) = leer_peticion(&mut stream) {
                        if pin_valido(&peticion, &expected_pin) {
                            intentos_fallidos = 0;
                            let payload_bytes = json_data.as_bytes();
                            let response = format!(
                                "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                                payload_bytes.len()
                            );
                            let _ = stream.write_all(response.as_bytes());
                            let _ = stream.write_all(payload_bytes);
                            let _ = stream.flush();
                        } else {
                            intentos_fallidos += 1;
                            let forbidden = "HTTP/1.1 403 FORBIDDEN\r\nConnection: close\r\n\r\nCodigo incorrecto";
                            let _ = stream.write_all(forbidden.as_bytes());
                            let _ = stream.flush();
                            if intentos_fallidos >= MAX_FAILED_ATTEMPTS {
                                RUNNING.store(false, Ordering::SeqCst);
                            }
                        }
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(Duration::from_millis(100));
                }
                Err(_) => {
                    thread::sleep(Duration::from_millis(100));
                }
            }
        }
    });

    Ok(local_ip)
}

/// Detiene el servidor emisor P2P
#[tauri::command]
pub fn stop_p2p_host() -> Result<bool, String> {
    RUNNING.store(false, Ordering::SeqCst);
    Ok(true)
}

/// Conecta a otro equipo en la red local y descarga los datos usando el código
#[tauri::command]
pub fn receive_p2p_data(target_ip: String, pin: String) -> Result<String, String> {
    let ip: IpAddr = target_ip
        .trim()
        .parse()
        .map_err(|_| "La dirección IP no es válida".to_string())?;
    let pin = pin.trim();
    if pin.is_empty() || pin.contains(['\r', '\n']) {
        return Err("El código no es válido".to_string());
    }

    let connect_addr = SocketAddr::new(ip, P2P_PORT);
    let mut stream = TcpStream::connect_timeout(&connect_addr, Duration::from_secs(5))
        .map_err(|e| format!("No se pudo conectar a {}: {}", connect_addr, e))?;

    stream
        .set_read_timeout(Some(Duration::from_secs(12)))
        .map_err(|e| e.to_string())?;
    stream
        .set_write_timeout(Some(Duration::from_secs(5)))
        .map_err(|e| e.to_string())?;

    let request = format!(
        "GET /sync HTTP/1.1\r\nHost: {}\r\nx-steam-pin: {}\r\nConnection: close\r\n\r\n",
        connect_addr, pin
    );

    stream
        .write_all(request.as_bytes())
        .map_err(|e| format!("Error enviando solicitud: {}", e))?;
    stream.flush().map_err(|e| e.to_string())?;

    let mut response_bytes = Vec::new();
    stream
        .read_to_end(&mut response_bytes)
        .map_err(|e| format!("Error leyendo respuesta: {}", e))?;

    interpretar_respuesta(&response_bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pin_solo_vale_en_una_cabecera_exacta() {
        let ok = "GET /sync HTTP/1.1\r\nX-Steam-Pin: ABCD2345\r\n\r\n";
        assert!(pin_valido(ok, "ABCD2345"));
        assert!(!pin_valido("GET /sync?pin=ABCD2345 HTTP/1.1\r\n\r\n", "ABCD2345"));
        assert!(!pin_valido("GET / HTTP/1.1\r\nX: pin=ABCD2345 x-steam-pin: ABCD2345\r\n\r\n", "ABCD2345"));
        assert!(!pin_valido("GET / HTTP/1.1\r\nx-steam-pin: ABCD23456\r\n\r\n", "ABCD2345"));
        assert!(!pin_valido(
            "GET / HTTP/1.1\r\nx-steam-pin: AAAA\r\nx-steam-pin: ABCD2345\r\n\r\n",
            "ABCD2345"
        ));
    }

    #[test]
    fn detecta_respuestas_incompletas() {
        assert_eq!(
            interpretar_respuesta(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\n{}").unwrap(),
            "{}"
        );
        assert!(interpretar_respuesta(b"HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\n{}").is_err());
        assert!(interpretar_respuesta(b"HTTP/1.1 403 FORBIDDEN\r\n\r\nx").is_err());
        assert!(interpretar_respuesta(b"").is_err());
    }

    /// Prueba de extremo a extremo: agrupada porque el puerto y RUNNING son compartidos.
    #[test]
    fn flujo_de_red() {
        let datos = format!("{{\"d\":\"{}\"}}", "x".repeat(1024 * 1024));
        start_p2p_host("ABCD2345".into(), datos.clone()).unwrap();
        thread::sleep(Duration::from_millis(300));

        // Un cliente que tarda en enviar la petición ya no pierde la conexión.
        for retraso in [1u64, 50, 150, 300] {
            let mut s = TcpStream::connect(("127.0.0.1", P2P_PORT)).unwrap();
            thread::sleep(Duration::from_millis(retraso));
            s.write_all(b"GET /sync HTTP/1.1\r\nx-steam-pin: ABCD2345\r\n\r\n").unwrap();
            let mut r = Vec::new();
            s.read_to_end(&mut r).unwrap();
            assert_eq!(interpretar_respuesta(&r).unwrap(), datos, "retraso {retraso}");
        }

        assert_eq!(receive_p2p_data("127.0.0.1".into(), "ABCD2345".into()).unwrap(), datos);

        // Cinco fallos seguidos apagan el emisor, incluso para el código correcto.
        for _ in 0..MAX_FAILED_ATTEMPTS {
            assert!(receive_p2p_data("127.0.0.1".into(), "MALO".into()).unwrap_err().contains("no coincide"));
        }
        thread::sleep(Duration::from_millis(400));
        assert!(receive_p2p_data("127.0.0.1".into(), "ABCD2345".into()).is_err());
        assert!(receive_p2p_data("no-es-ip".into(), "ABCD2345".into()).is_err());
    }
}
