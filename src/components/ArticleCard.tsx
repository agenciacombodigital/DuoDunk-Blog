import { Link } from 'react-router-dom'

export default function ArticleCard({ article }: any) {
  return (
    <Link 
      to={`/artigos/${article.slug}`}
      className="group flex items-center gap-4 bg-card p-4 rounded-lg transition-all duration-300 hover:bg-border/50 hover:shadow-lg"
    >
      <img
        src={article.image_url}
        alt={article.title}
        className="w-24 h-24 object-cover rounded-md flex-shrink-0"
        loading="lazy"
      />
      <div className="overflow-hidden">
        <span className="text-accent text-xs font-bold uppercase">Análise</span>
        <h3 className="font-bold text-lg text-white truncate group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2">
          {article.summary}
        </p>
      </div>
    </Link>
  )
}