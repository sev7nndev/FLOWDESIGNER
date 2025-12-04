# Script para adicionar endpoint de delete de imagens
Write-Host "🔧 Adicionando endpoint de delete de imagens..." -ForegroundColor Cyan

$serverFile = "backend\server.cjs"
$content = Get-Content $serverFile -Raw

# Criar backup
Copy-Item $serverFile "$serverFile.backup-delete-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force

# Código do endpoint de delete
$deleteEndpoint = @'

// 1.5. Delete Image Endpoint
app.delete('/api/images/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const { id } = req.params;

    console.log(`🗑️ User ${user.id} deleting image ${id}`);

    // Delete only if it belongs to the user (security)
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }

    console.log('✅ Image deleted successfully');
    
    // IMPORTANT: We do NOT decrement the usage counter!
    // The counter tracks how many images were GENERATED, not how many exist.
    // User must wait for monthly cycle reset or upgrade plan.

    res.json({ success: true, message: 'Imagem excluída com sucesso' });

  } catch (error) {
    console.error('Delete Image Error:', error);
    res.status(500).json({ error: 'Erro ao excluir imagem' });
  }
});

'@

# Encontrar onde inserir (antes do "// 2. Check Quota Endpoint")
$marker = "// 2. Check Quota Endpoint"
$content = $content -replace [regex]::Escape($marker), "$deleteEndpoint$marker"

# Salvar
$content | Out-File -FilePath $serverFile -Encoding utf8 -NoNewline

Write-Host "✅ Endpoint de delete adicionado!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Reinicie o backend:" -ForegroundColor Yellow
Write-Host "   Ctrl+C → node backend/server.cjs" -ForegroundColor Gray
