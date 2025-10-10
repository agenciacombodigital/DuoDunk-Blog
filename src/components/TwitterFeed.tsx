import { useEffect } from 'react';

export default function TwitterFeed() {
  useEffect(() => {
    // Carregar script do Twitter apenas uma vez
    if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <span>O que está bombando</span>
            <span className="text-3xl">🔥</span>
          </h2>
        </div>

        {/* Grid com múltiplas listas oficiais da NBA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista 1: NBA Official */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <a 
              className="twitter-timeline"
              data-height="600"
              data-theme="light"
              data-tweet-limit="5"
              data-chrome="noheader nofooter"
              href="https://twitter.com/NBA?ref_src=twsrc%5Etfw"
            >
              Tweets da NBA
            </a>
          </div>

          {/* Lista 2: NBA Brasil */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <a 
              className="twitter-timeline"
              data-height="600"
              data-theme="light"
              data-tweet-limit="5"
              data-chrome="noheader nofooter"
              href="https://twitter.com/NBABrasil?ref_src=twsrc%5Etfw"
            >
              Tweets da NBA Brasil
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Atualizações em tempo real direto do X (Twitter)
          </p>
        </div>
      </div>
    </section>
  );
}