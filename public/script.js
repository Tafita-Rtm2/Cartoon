async function transform(model) {
  const form = document.getElementById('uploadForm');
  const formData = new FormData(form);
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = 'Transformation en cours...';

  try {
    const response = await fetch(`/transform/${model}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la transformation.');
    }
    
    const data = await response.json();
    const imageUrl = data.image;
    
    // Affiche l'image transformée et ajoute un bouton de téléchargement
    resultDiv.innerHTML = `
      <img src="${imageUrl}" alt="Image transformée">
      <br>
      <a href="${imageUrl}" download="transformed.jpg" class="download-btn">Télécharger l'image</a>
    `;
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
  }
}
