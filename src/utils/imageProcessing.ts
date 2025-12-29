/**
 * Otimiza uma imagem para o padrão Open Graph (1200x630 JPG).
 * Realiza o redimensionamento 'cover' e conversão de formato.
 */
export async function optimizeImageForOG(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const targetWidth = 1200;
      const targetHeight = 630;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Lógica de Redimensionamento 'Cover'
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const x = (targetWidth / 2) - (img.width / 2) * scale;
      const y = (targetHeight / 2) - (img.height / 2) * scale;
      
      if (ctx) {
        // Fundo branco caso a imagem original tenha transparência
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao processar imagem no Canvas'));
      }, 'image/jpeg', 0.85); // Compressão 85%
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    reader.readAsDataURL(file);
  });
}