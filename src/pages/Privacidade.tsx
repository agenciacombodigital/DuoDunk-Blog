import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Privacidade() {
  return (
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
            <Shield className="w-8 h-8 text-[#FA007D]" />
            <h1 className="text-4xl font-bold text-gray-900">
              Política de Privacidade
            </h1>
          </div>

          <p className="text-gray-600 mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            {/* 1. Introdução */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
              <p className="text-gray-700 leading-relaxed">
                A <strong>DuoDunk</strong> valoriza sua privacidade e está comprometida em proteger seus dados pessoais. 
                Esta Política de Privacidade explica como coletamos, usamos, armazenamos e compartilhamos suas informações 
                quando você utiliza nosso site.
              </p>
            </section>

            {/* 2. Dados Coletados */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Dados Coletados</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Coletamos as seguintes informações:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Dados de navegação:</strong> Páginas visitadas, tempo de permanência, cliques, dispositivo usado</li>
                <li><strong>Cookies:</strong> Para melhorar a experiência de navegação (veja nossa Política de Cookies)</li>
                <li><strong>Comentários:</strong> Nome, e-mail e conteúdo (via Disqus)</li>
                <li><strong>Endereço IP:</strong> Para fins de segurança e análise de tráfego</li>
              </ul>
            </section>

            {/* 3. Como Usamos Seus Dados */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Usamos Seus Dados</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Melhorar a experiência de navegação no site</li>
                <li>Analisar o comportamento dos usuários para otimizar conteúdo</li>
                <li>Garantir a segurança e prevenir fraudes</li>
                <li>Responder a solicitações de suporte</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            {/* 4. Compartilhamento de Dados */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartilhamento de Dados</h2>
              <p className="text-gray-700 leading-relaxed">
                A DuoDunk <strong>não vende</strong> seus dados pessoais. Compartilhamos informações apenas com:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-4">
                <li><strong>Provedores de serviços:</strong> Vercel (hospedagem), Supabase (banco de dados), Disqus (comentários)</li>
                <li><strong>Autoridades legais:</strong> Quando exigido por lei</li>
              </ul>
            </section>

            {/* 5. Cookies e Tecnologias Similares */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies e Tecnologias Similares</h2>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos cookies para melhorar sua experiência. Para mais informações, consulte nossa{' '}
                <Link to="/cookies" className="text-[#00DBFB] hover:text-[#FA007D] underline">
                  Política de Cookies
                </Link>.
              </p>
            </section>

            {/* 6. Seus Direitos */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Seus Direitos (LGPD/GDPR)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Você tem direito a:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Acessar:</strong> Solicitar cópia dos seus dados</li>
                <li><strong>Retificar:</strong> Corrigir dados incorretos</li>
                <li><strong>Excluir:</strong> Solicitar remoção dos seus dados</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Para exercer seus direitos, entre em contato: <a href="mailto:privacidade@duodunk.com" className="text-[#00DBFB] hover:text-[#FA007D] underline">privacidade@duodunk.com</a>
              </p>
            </section>

            {/* 7. Segurança */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Segurança dos Dados</h2>
              <p className="text-gray-700 leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, 
                perda ou alteração. No entanto, nenhum sistema é 100% seguro.
              </p>
            </section>

            {/* 8. Menores de Idade */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Menores de Idade</h2>
              <p className="text-gray-700 leading-relaxed">
                Nosso site não é direcionado a menores de 13 anos. Não coletamos intencionalmente dados de crianças. 
                Se você é pai/mãe e acredita que seu filho forneceu dados, entre em contato conosco.
              </p>
            </section>

            {/* 9. Alterações */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Alterações nesta Política</h2>
              <p className="text-gray-700 leading-relaxed">
                Podemos atualizar esta Política periodicamente. A data de "Última atualização" no topo indica a versão mais recente.
              </p>
            </section>

            {/* 10. Contato */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contato</h2>
              <p className="text-gray-700 leading-relaxed">
                Para dúvidas sobre esta Política de Privacidade:
              </p>
              <ul className="list-none text-gray-700 space-y-2 mt-4">
                <li><strong>E-mail:</strong> <a href="mailto:privacidade@duodunk.com" className="text-[#00DBFB] hover:text-[#FA007D] underline">privacidade@duodunk.com</a></li>
                <li><strong>Site:</strong> <a href="https://duo-dunk-blog.vercel.app" className="text-[#00DBFB] hover:text-[#FA007D] underline">duo-dunk-blog.vercel.app</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}