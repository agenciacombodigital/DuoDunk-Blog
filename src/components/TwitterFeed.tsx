import { useEffect } from 'react';

const twitterAccounts = [
  { username: 'ShamsCharania', name: 'Shams Charania' },
  { username: 'NBA', name: 'NBA' },
  { username: 'NBABrasil', name: 'NBA Brasil' },
  { username: 'Ballislife', name: 'Ballislife' },
  { username: 'ESPNNBA', name: 'ESPN NBA' }
];

// Estendendo a interface Window para incluir o objeto do widget do Twitter
declare global {
  interface Window {
    twttr?: any;
  }
}

export default function TwitterFeed() {
  useEffect(() => {
    // Função para carregar e renderizar as timelines sequencialmente
    const loadTimelines = () => {
      if (window.twttr && window.twttr.widgets) {
        // Limpa os widgets existentes para evitar duplicatas em recarregamentos
        document.querySelectorAll('.twitter-timeline-container').forEach(container => {
          if (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        });

        // Renderiza cada timeline com um atraso para evitar o rate limiting
        twitterAccounts.forEach((account, index) => {
          setTimeout(() => {
            window.twttr.widgets.createTimeline(
              {
                sourceType: 'profile',
                screenName: account.username
              },
              document.getElementById(`twitter-timeline-${account.username}`),
              {
                height: '500',
                theme: 'light',
                tweetLimit: 3,
                chrome: 'noheader nofooter noborders'
              }
            );
          }, index * 500); // Atraso de 500ms entre cada solicitação
        });
      }
    };

    // Verifica se o script já está carregado
    if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = loadTimelines; // Carrega as timelines assim que o script estiver pronto
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } else {
      // Se o script já existe, apenas tenta carregar as timelines
      loadTimelines();
    }
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-900">
            O que está bombando 🔥
          </h2>
        </div>

        <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
          {twitterAccounts.map((account) => (
            <div key={account.username} className="w-80 flex-shrink-0">
              <div 
                id={`twitter-timeline-${account.username}`}
                className="twitter-timeline-container bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-[500px] flex items-center justify-center text-gray-500 text-sm p-4"
              >
                Carregando tweets de @{account.username}...
              </div>
            </div>
          ))}
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