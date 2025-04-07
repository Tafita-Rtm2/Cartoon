async function transform(model) {
  const form = document.getElementById('uploadForm');
  const formData = new FormData(form);
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = 'Transformation en cours...';

  try {
    const res = await fetch(`/transform/${model}`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error('Erreur lors de la transformation.');
    }
    const data = await res.json();
    resultDiv.innerHTML = `<img src="${data.image}" alt="Image transformée">`;
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
  }
}
