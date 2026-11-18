export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#05070b" }}>
      <iframe
        title="TES HBF"
        src="/game/index.html"
        allow="identity-credentials-get; clipboard-write"
        style={{ display: "block", width: "100vw", height: "100vh", border: 0 }}
      />
    </main>
  )
}
