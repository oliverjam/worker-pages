export function render() {
  return `<form method="POST"><button name="hi" value="go">Go</button></form>`;
}

export async function action({ request }) {
  console.log(await request.text());
}
