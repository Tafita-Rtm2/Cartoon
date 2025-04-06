async function transform(model) {
  const form = document.getElementById('uploadForm');
  const formData = new FormData(form);
  document.getElementById('result').innerHTML = 'Transformation en cours...';

  const res = await fetch(`/transform/${model}`, {
    method: 'POST',
    body: formData,
  });

  if (res.ok) {
    const data = await res.json();
    document.getElementById('result').innerHTML = `<img src="${data.image}" alt="Image stylisée">`;
  } else {
    document.getElementById('result').innerHTML = 'Erreur lors de la transformation.';
  }
}
