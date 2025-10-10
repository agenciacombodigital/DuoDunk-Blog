import { useEffect } from 'react';

const twitterAccounts = [
  { username: 'ShamsCharania', name: 'Shams Charania' },
  { username: 'NBA', name: 'NBA' },
  { username: 'NBABrasil', name: 'NBA Brasil' },
  { username: 'Ballislife', name: 'Ballislife' },
  { username: 'ESPNNBA', name: 'ESPN NBA' }
];

export default function TwitterFeed() {
  useEffect(() => {
    // Carregar script do Twitter
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
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
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-[500px]">
                <a
                  className="twitter-timeline"
                  data-height="500"
                  data-theme="light"
                  data-tweet-limit="3"
                  data-chrome="noheader nofooter noborders"
                  href={`https://twitter.com/${account.username}?ref_src=twsrc%5Etfw`}
                >
                  Carregando tweets de @{account.username}...
                </a>
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