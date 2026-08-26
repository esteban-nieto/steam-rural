type CardProps = {
  title: string
  description?: string
  image?: string
  onClick?: () => void
  badge?: string
}

export function Card({ title, description, image, onClick, badge }: CardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden border border-gray-100 flex flex-col"
    >
      {image && <img src={image} alt={title} className="h-36 w-full object-cover" />}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">{title}</h3>
          {badge && <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">{badge}</span>}
        </div>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    </div>
  )
}
