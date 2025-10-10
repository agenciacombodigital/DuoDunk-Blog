const TwitterCard = ({ handle, name, url }: { handle: string, name: string, url: string }) => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center text-center h-full">
    <div className="bg-gray-900 p-3 rounded-full mb-4">
      <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    </div>
    <h3 className="font-bold text-lg text-gray-900">{name}</h3>
    <p className="text-sm text-gray-500 mb-6">@{handle}</p>
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-auto bg-gray-900 text-white font-semibold px-6 py-2 rounded-full hover:bg-gray-700 transition-colors w-full"
    >
      Ver no X (Twitter)
    </a>
  </div>
);

export default function TwitterFeed() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <span>O que está bombando</span>
            <span className="text-3xl">🔥</span>
          </h2>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md mb-8" role="alert">
          <p className="font-bold">Aviso sobre o Feed do Twitter</p>
          <p>Para garantir uma experiência estável, os feeds ao vivo foram substituídos por links diretos. O Twitter (X) impõe limites de visualização que podem interromper o serviço temporariamente.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TwitterCard 
            name="NBA" 
            handle="NBA" 
            url="https://twitter.com/NBA" 
          />
          <TwitterCard 
            name="NBA Brasil" 
            handle="NBABrasil" 
            url="https://twitter.com/NBABrasil" 
          />
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Acompanhe as contas oficiais para atualizações em tempo real.
          </p>
        </div>
      </div>
    </section>
  );
}