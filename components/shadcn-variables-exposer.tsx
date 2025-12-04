/**
 * Shadcn/UI Variable Exposer for Tweakcn
 * This component helps external tools like tweakcn.com detect the shadcn/ui setup
 */

export default function ShadcnVariablesExposer() {
  return (
    <div 
      id="shadcn-ui-config" 
      data-shadcn-ui="configured"
      data-style="default"
      data-has-variables="true"
      style={{ display: 'none' }}
      data-variables={JSON.stringify({
        '--background': '0 0% 100%',
        '--foreground': '0 0% 3.9%',
        '--primary': '272 97% 62%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '25 95% 53%',
        '--secondary-foreground': '0 0% 0%',
        '--accent': '0 0% 96.1%',
        '--accent-foreground': '0 0% 9%',
        '--destructive': '4.1 78.9% 54.5%',
        '--destructive-foreground': '0 0% 100%',
        '--muted': '0 0% 96.1%',
        '--muted-foreground': '0 0% 45.1%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 3.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 3.9%',
        '--border': '0 0% 89.8%',
        '--input': '0 0% 89.8%',
        '--ring': '272 97% 62%',
        '--radius': '0.5rem'
      })}
    >
      {/* This hidden element helps tools detect shadcn/ui configuration */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --background: 0 0% 100%;
            --foreground: 0 0% 3.9%;
            --primary: 272 97% 62%;
            --primary-foreground: 0 0% 100%;
            --secondary: 25 95% 53%;
            --secondary-foreground: 0 0% 0%;
            --accent: 0 0% 96.1%;
            --accent-foreground: 0 0% 9%;
            --destructive: 4.1 78.9% 54.5%;
            --destructive-foreground: 0 0% 100%;
            --muted: 0 0% 96.1%;
            --muted-foreground: 0 0% 45.1%;
            --card: 0 0% 100%;
            --card-foreground: 0 0% 3.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 0 0% 3.9%;
            --border: 0 0% 89.8%;
            --input: 0 0% 89.8%;
            --ring: 272 97% 62%;
            --radius: 0.5rem;
          }
        `
      }} />
    </div>
  )
}
