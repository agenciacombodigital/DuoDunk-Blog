import React, { useState, useRef, useEffect } from 'react';
import { Target, Grid3x3, Smartphone, Monitor, RotateCcw, User } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getObjectPositionStyle, getHorizontalFocalPoint, getVerticalFocalPoint } from '@/lib/utils';

interface ImageFocalPointEditorProps {
  imageUrl: string;
  // Formato: "X% Y%" para desktop, "Y%" para mobile
  initialFocalPointDesktop: string;
  initialFocalPointMobile: string;
  onFocalPointChange: (desktop: string, mobile: string) => void;
  onFocalPointCommit: (desktop: string, mobile: string) => void;
}

export default function ImageFocalPointEditor({
  imageUrl,
  initialFocalPointDesktop,
  initialFocalPointMobile,
  onFocalPointChange,
  onFocalPointCommit,
}: ImageFocalPointEditorProps) {
  const [focalPointDesktop, setFocalPointDesktop] = useState(initialFocalPointDesktop);
  const [focalPointMobile, setFocalPointMobile] = useState(initialFocalPointMobile);
  const [showGrid, setShowGrid] = useState(true);
  const imageRef = useRef<HTMLDivElement>(null);

  // Sincroniza estados internos com props externas (necessário para o AdminPage)
  useEffect(() => {
    setFocalPointDesktop(initialFocalPointDesktop);
    setFocalPointMobile(initialFocalPointMobile);
  }, [initialFocalPointDesktop, initialFocalPointMobile]);

  // Extrai X e Y atuais para os sliders
  const currentX = getHorizontalFocalPoint(focalPointDesktop);
  const currentY = getVerticalFocalPoint(focalPointDesktop);
  const currentMobileY = getVerticalFocalPoint(focalPointMobile);

  // --- Handlers de Interação ---

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newX = Math.max(0, Math.min(100, x)).toFixed(0);
    const newY = Math.max(0, Math.min(100, y)).toFixed(0);
    
    const newDesktop = `${newX}% ${newY}%`;
    
    // Atualiza o ponto focal desktop e o ponto focal mobile (apenas Y)
    setFocalPointDesktop(newDesktop);
    setFocalPointMobile(`${newY}%`);
    
    onFocalPointChange(newDesktop, `${newY}%`);
    onFocalPointCommit(newDesktop, `${newY}%`); // Comita imediatamente no clique
  };

  const handleDesktopXChange = (value: number[]) => {
    const newX = `${value[0]}%`;
    const newDesktop = `${newX} ${currentY}%`;
    setFocalPointDesktop(newDesktop);
    onFocalPointChange(newDesktop, focalPointMobile);
  };

  const handleDesktopYChange = (value: number[]) => {
    const newY = `${value[0]}%`;
    const newDesktop = `${currentX}% ${newY}`;
    setFocalPointDesktop(newDesktop);
    onFocalPointChange(newDesktop, focalPointMobile);
  };

  const handleMobileYChange = (value: number[]) => {
    const newMobile = `${value[0]}%`;
    setFocalPointMobile(newMobile);
    onFocalPointChange(focalPointDesktop, newMobile);
  };
  
  // --- Presets ---
  const presets = [
    { name: 'Centro', icon: Target, x: 50, y: 50 },
    { name: 'Rostos (35% Y)', icon: User, x: 50, y: 35 },
    { name: 'Topo (25% Y)', icon: Grid3x3, x: 50, y: 25 },
  ];

  const applyPreset = (preset: { x: number, y: number }) => {
    const newDesktop = `${preset.x}% ${preset.y}%`;
    const newMobile = `${preset.y}%`;
    
    setFocalPointDesktop(newDesktop);
    setFocalPointMobile(newMobile);
    
    onFocalPointChange(newDesktop, newMobile);
    onFocalPointCommit(newDesktop, newMobile);
  };

  const reset = () => {
    applyPreset({ x: 50, y: 50 });
  };

  return (
    <div className="space-y-6">
      
      {/* Presets e Ações */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-4">
        <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Controles Rápidos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-purple-600/20 border border-gray-700 hover:border-purple-500 rounded-lg transition-all text-sm text-white"
            >
              <preset.icon className="w-4 h-4 text-slate-400" />
              {preset.name}
            </button>
          ))}
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-red-600/20 border border-gray-700 hover:border-red-500 rounded-lg transition-all text-sm text-white"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm text-white ${
              showGrid 
                ? 'bg-purple-600/20 border border-purple-500' 
                : 'bg-gray-800 border border-gray-700'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            Grade
          </button>
        </div>
      </div>

      {/* Previews e Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Editor Principal (16:9) */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-700 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-400" />
            Editor Interativo (Desktop 16:9)
          </h3>
          <div 
            ref={imageRef}
            className="relative w-full aspect-video bg-gray-800 rounded-xl overflow-hidden cursor-crosshair"
            onMouseDown={handleImageClick} // Usamos onMouseDown para clique simples
          >
            <img
              src={imageUrl}
              alt="Preview Desktop"
              className="w-full h-full object-cover transition-transform duration-300"
              style={getObjectPositionStyle(focalPointDesktop)}
            />

            {/* Grade */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Linhas verticais */}
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                {/* Linhas horizontais */}
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
              </div>
            )}

            {/* Ponto Focal */}
            <div
              className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none"
              style={{
                left: `${currentX}%`,
                top: `${currentY}%`
              }}
            >
              <div className="w-full h-full border-2 border-purple-500 rounded-full bg-purple-500/20 animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-purple-500 rounded-full m-auto" />
            </div>
          </div>
          
          {/* Sliders de Ajuste Fino Desktop */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <label className="text-sm font-semibold text-gray-400 mb-2 block">Foco Horizontal (X: {currentX.toFixed(0)}%)</label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">Esquerda</span>
              <Slider 
                value={[currentX]} 
                onValueChange={handleDesktopXChange} 
                onValueCommit={(value) => onFocalPointCommit(`${value[0]}% ${currentY}%`, focalPointMobile)}
                max={100} 
                step={1} 
                className="w-full" 
              />
              <span className="text-xs text-gray-400">Direita</span>
            </div>
            
            <label className="text-sm font-semibold text-gray-400 mt-4 mb-2 block">Foco Vertical (Y: {currentY.toFixed(0)}%)</label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">Topo</span>
              <Slider 
                value={[currentY]} 
                onValueChange={handleDesktopYChange} 
                onValueCommit={(value) => onFocalPointCommit(`${currentX}% ${value[0]}%`, focalPointMobile)}
                max={100} 
                step={1} 
                className="w-full" 
              />
              <span className="text-xs text-gray-400">Baixo</span>
            </div>
          </div>
        </div>

        {/* Mobile Preview (3:4) */}
        <div className="lg:col-span-1 bg-gray-900/50 border border-gray-700 rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-400" />
            Preview Mobile (3:4)
          </h3>
          <div className="relative w-full aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden max-w-xs mx-auto border-2 border-green-400/50">
            <img
              src={imageUrl}
              alt="Preview Mobile"
              className="w-full h-full object-cover"
              style={getObjectPositionStyle(focalPointMobile, true)}
            />
            <div className="absolute inset-0 border-4 border-dashed border-white/50 pointer-events-none flex items-center justify-center">
              <span className="text-white text-xs bg-black/50 p-1 rounded font-inter">Corte Mobile (3:4)</span>
            </div>
          </div>
          
          {/* Slider de Ajuste Fino Mobile */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <label className="text-sm font-semibold text-gray-400 mb-2 block">Foco Vertical (Y: {currentMobileY.toFixed(0)}%)</label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">Topo</span>
              <Slider 
                value={[currentMobileY]} 
                onValueChange={handleMobileYChange} 
                onValueCommit={(value) => onFocalPointCommit(focalPointDesktop, `${value[0]}%`)}
                max={100} 
                step={1} 
                className="w-full" 
              />
              <span className="text-xs text-gray-400">Baixo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}