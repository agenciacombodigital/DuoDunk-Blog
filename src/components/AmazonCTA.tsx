import Link from 'next/link';
import { Tv, Zap } from 'lucide-react';

const AMAZON_AFFILIATE_LINK = "https://amzn.to/3KaOGB9";

export default function AmazonCTA() {
  return (
    <div className="bg-[#00A8E1]/10 border-l-4 border-[#00A8E1] rounded-xl p-6 mb-10 shadow-md">
      <div className="flex items-start gap-4">
        <Zap className="w-6 h-6 text-[#00A8E1] flex-shrink-0 mt-1" />
        <div>
          <p className="text-gray-800 font-semibold text-lg mb-3 leading-relaxed font-inter">
            Dica DuoDunk: Assista aos jogos da NBA ao vivo no Prime Video.
          </p>
          <Link
            href={AMAZON_AFFILIATE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#00A8E1] hover:bg-[#0088B3] text-white font-bold px-5 py-2 rounded-lg transition-colors text-sm shadow-lg"
          >
            <Tv className="w-4 h-4" />
            Teste 30 dias grátis
          </Link>
        </div>
      </div>
    </div>
  );
}