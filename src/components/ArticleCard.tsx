import { Link } from 'react-router-dom'

export default function ArticleCard({ article }: any) {
  return (
    <Link 
      to={`/artigos/${article.slug}`}
      className="article-card"
    >
      <div className="relative overflow-hidden">
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-6">
        <h3 className="font-bold text-xl mb-2">
          {article.title}
        </h3>
        <p className="text-sm line-clamp-2">
          {article.summary}
        </p>
      </div>
    </Link>
  )
}