export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
          <h1 style={{fontSize: '6rem', fontWeight: 'bold', color: '#fd9c2d'}}>404</h1>
          <p>Page Not Found</p>
          <a href="/" style={{marginTop: '2rem', padding: '0.5rem 1.5rem', backgroundColor: '#fd9c2d', color: 'white', textDecoration: 'none', borderRadius: '0.5rem'}}>Go Home</a>
        </div>
      </body>
    </html>
  )
}
