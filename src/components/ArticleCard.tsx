import { Link } from 'react-router-dom'

export default function ArticleCard({ article }: any) {
  return (
    <Link 
      to={`/artigos/${article.slug}`}
      className="card-premium group block"
    >
      <div className="relative overflow-hidden">
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>
      <div className="p-6">
        <h3 className="font-bold text-xl text-white mb-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2">
          {article.summary}
        </p>
      </div>
    </Link>
  )
}