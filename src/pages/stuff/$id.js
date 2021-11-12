export function loader({ params }) {
  return { id: params.id };
}

export function render({ id }) {
  return `<h1>Hello ${id}</h1>`;
}
