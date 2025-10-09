import { Link } from 'react-router-dom'

export default function ArticleCard({ article }: any) {
  return (
    <Link 
      to={`/artigos/${article.slug}`}
      className="group block card-duodunk"
    >
      <img
        src={article.image_url}
        alt={article.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2">
          {article.summary}
        </p>
      </div>
    </Link>
  )
}