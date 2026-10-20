use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

static RUNNING: AtomicBool = AtomicBool::new(false);

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
    RUNNING.store(false, Ordering::SeqCst);
    thread::sleep(Duration::from_millis(150));

    let local_ip = match get_local_ip() {
        Ok(ip) => ip,
        Err(_) => "127.0.0.1".to_string(),
    };

    let bind_addr = "0.0.0.0:4545";
    let listener = TcpListener::bind(bind_addr).map_err(|e| format!("Error enlazando puerto 4545: {}", e))?;
    listener
        .set_nonblocking(true)
        .map_err(|e| e.to_string())?;

    RUNNING.store(true, Ordering::SeqCst);
    let expected_pin = pin.clone();
    let data_to_serve = json_data.clone();

    thread::spawn(move || {
        while RUNNING.load(Ordering::SeqCst) {
            match listener.accept() {
                Ok((mut stream, _addr)) => {
                    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
                    let _ = stream.set_write_timeout(Some(Duration::from_secs(10)));

                    let mut buffer = [0u8; 1024];
                    if let Ok(bytes_read) = stream.read(&mut buffer) {
                        let request_str = String::from_utf8_lossy(&buffer[..bytes_read]);

                        if request_str.contains(&format!("x-steam-pin: {}", expected_pin))
                            || request_str.contains(&format!("pin={}", expected_pin))
                        {
                            let payload_bytes = data_to_serve.as_bytes();
                            let response = format!(
                                "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n",
                                payload_bytes.len()
                            );
                            let _ = stream.write_all(response.as_bytes());
                            let _ = stream.write_all(payload_bytes);
                            let _ = stream.flush();
                        } else {
                            let forbidden = "HTTP/1.1 403 FORBIDDEN\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\nPIN Incorrecto";
                            let _ = stream.write_all(forbidden.as_bytes());
                            let _ = stream.flush();
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

/// Conecta a otro equipo en la red local y descarga los datos usando el PIN
#[tauri::command]
pub fn receive_p2p_data(target_ip: String, pin: String) -> Result<String, String> {
    let connect_addr = format!("{}:4545", target_ip.trim());
    let mut stream = TcpStream::connect(&connect_addr)
        .map_err(|e| format!("No se pudo conectar a {}: {}", connect_addr, e))?;

    stream
        .set_read_timeout(Some(Duration::from_secs(12)))
        .map_err(|e| e.to_string())?;
    stream
        .set_write_timeout(Some(Duration::from_secs(5)))
        .map_err(|e| e.to_string())?;

    let request = format!(
        "GET /sync HTTP/1.1\r\nHost: {}\r\nx-steam-pin: {}\r\nConnection: close\r\n\r\n",
        connect_addr,
        pin.trim()
    );

    stream
        .write_all(request.as_bytes())
        .map_err(|e| format!("Error enviando solicitud: {}", e))?;
    stream.flush().map_err(|e| e.to_string())?;

    let mut response_bytes = Vec::new();
    stream
        .read_to_end(&mut response_bytes)
        .map_err(|e| format!("Error leyendo respuesta: {}", e))?;

    let response_str = String::from_utf8_lossy(&response_bytes).to_string();

    if response_str.contains("403 FORBIDDEN") {
        return Err("El PIN ingresado no coincide con el del equipo emisor.".to_string());
    }

    if let Some(pos) = response_str.find("\r\n\r\n") {
        let json_body = &response_str[pos + 4..];
        Ok(json_body.to_string())
    } else {
        Err("Respuesta no válida del equipo emisor".to_string())
    }
}
