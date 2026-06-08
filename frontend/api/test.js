export default function handler(req, res) {
  res.setHeader('content-type', 'application/json')
  res.status(200).json({ status: 'ok', url: req.url })
}
