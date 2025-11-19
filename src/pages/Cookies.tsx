import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';
import PageMeta from '@/components/PageMeta';

export default function Cookies() {
  const lastUpdated = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      <PageMeta
        title="Política de Cookies - Duo Dunk"
        description={`Entenda como o Duo Dunk utiliza cookies para melhorar sua experiência de navegação e quais são seus direitos. Atualizado em ${lastUpdated}.`}
        canonicalPath="/cookies"
      />
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FA007D] transition-colors mb-8 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>

            <div className="flex items-center gap-3 mb-8">
              <Cookie className="w-8 h-8 text-[#FA007D]" />
              <h1 className="text-4xl font-bold text-gray-900">
                Política de Cookies
              </h1>
            </div>

            <p className="text-gray-600 mb-8">
              Última atualização: {lastUpdated}
            </p>

            <div className="prose prose-lg max-w-none space-y-8">
              {/* 1. O que são Cookies */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. O que são Cookies?</h2>
                <p className="text-gray-700 leading-relaxed">
                  Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. 
                  Eles ajudam a melhorar sua experiência, lembrando suas preferências e analisando o uso do site.
                </p>
              </section>

              {/* 2. Tipos de Cookies */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Tipos de Cookies que Usamos</h2>
                
                <div className="space-y-6">
                  {/* Cookies Essenciais */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🔒 Cookies Essenciais</h3>
                    <p className="text-gray-700 mb-2">
                      <strong>Finalidade:</strong> Necessários para o funcionamento básico do site
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong>Exemplo:</strong> Autenticação, segurança, preferências de idioma
                    </p>
                    <p className="text-gray-700">
                      <strong>Podem ser desativados?</strong> ❌ Não (necessários para operação)
                    </p>
                  </div>

                  {/* Cookies de Performance */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">📊 Cookies de Performance</h3>
                    <p className="text-gray-700 mb-2">
                      <strong>Finalidade:</strong> Analisar como o site é usado (estatísticas anônimas)
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong>Exemplo:</strong> Páginas mais visitadas, tempo de permanência
                    </p>
                    <p className="text-gray-700">
                      <strong>Podem ser desativados?</strong> ✅ Sim (nas configurações do navegador)
                    </p>
                  </div>

                  {/* Cookies Funcionais */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">⚙️ Cookies Funcionais</h3>
                    <p className="text-gray-700 mb-2">
                      <strong>Finalidade:</strong> Lembrar suas preferências e configurações
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong>Exemplo:</strong> Tema escuro/claro, configurações de exibição
                    </p>
                    <p className="text-gray-700">
                      <strong>Podem ser desativados?</strong> ✅ Sim (mas pode afetar a experiência)
                    </p>
                  </div>

                  {/* Cookies de Terceiros */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🌐 Cookies de Terceiros</h3>
                    <p className="text-gray-700 mb-2">
                      <strong>Finalidade:</strong> Serviços integrados (comentários, análise)
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong>Exemplo:</strong> Disqus (comentários), Vercel Analytics
                    </p>
                    <p className="text-gray-700">
                      <strong>Podem ser desativados?</strong> ✅ Sim (nas configurações do navegador)
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. Cookies Específicos */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cookies Específicos Usados</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cookie</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duração</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Finalidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">_vercel_session</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Essencial</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Sessão</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Gerenciamento de sessão</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">disqus_unique</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Funcional</td>
                        <td className="px-4 py-3 text-sm text-gray-700">1 ano</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Comentários (Disqus)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">_ga</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Performance</td>
                        <td className="px-4 py-3 text-sm text-gray-700">2 anos</td>
                        <td className="px-4 py-3 text-sm text-gray-700">Análise de uso (Google Analytics)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. Como Gerenciar Cookies */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Como Gerenciar Cookies</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Você pode controlar e/ou excluir cookies nas configurações do seu navegador:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Google Chrome:</strong> Configurações → Privacidade e segurança → Cookies</li>
                  <li><strong>Mozilla Firefox:</strong> Opções → Privacidade e segurança → Cookies</li>
                  <li><strong>Safari:</strong> Preferências → Privacidade → Cookies</li>
                  <li><strong>Microsoft Edge:</strong> Configurações → Cookies e permissões</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  ⚠️ <strong>Atenção:</strong> Desativar cookies pode afetar funcionalidades do site.
                </p>
              </section>

              {/* 5. Atualizações */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Atualizações desta Política</h2>
                <p className="text-gray-700 leading-relaxed">
                  Podemos atualizar esta Política de Cookies periodicamente. Recomendamos revisar esta página regularmente.
                </p>
              </section>

              {/* 6. Contato */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contato</h2>
                <p className="text-gray-700 leading-relaxed">
                  Dúvidas sobre cookies? Entre em contato:
                </p>
                <ul className="list-none text-gray-700 space-y-2 mt-4">
                  <li><strong>E-mail:</strong> <a href="mailto:privacidade@duodunk.com" className="text-[#00DBFB] hover:text-[#FA007D] underline">privacidade@duodunk.com</a></li>
                </ul>
              </section>

              {/* Links Relacionados */}
              <section className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  📄 Veja também nossa{' '}
                  <Link to="/privacidade" className="text-[#00DBFB] hover:text-[#FA007D] underline font-semibold">
                    Política de Privacidade
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}