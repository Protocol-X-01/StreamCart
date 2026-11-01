const app = import('../apps/api/dist/app.js').then(({ createApp }) => createApp());

export const config = { maxDuration: 30 };
export default async function handler(request, response) {
  return (await app)(request, response);
}
