import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🏀 Iniciando geração de posts da NBA...');
    
    const { stdout, stderr } = await execAsync('node scripts/gerarPostsResultados.js', {
      env: {
        ...process.env,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });

    console.log('✅ Output:', stdout);
    if (stderr) console.error('⚠️ Stderr:', stderr);

    return res.status(200).json({
      success: true,
      message: 'Post gerado com sucesso!',
      output: stdout
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}