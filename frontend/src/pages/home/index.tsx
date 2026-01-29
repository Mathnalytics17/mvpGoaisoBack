import { useRouter } from "next/navigation";

export default function Home() {

  const router = useRouter();
  return (
    <div className="home-class">
      <div className="home-left">
        <span className="badge">SEO + IA en un solo lugar</span>

        <h1>
          Bienvenido a <span>goAISO</span>
        </h1>

        <p>
          Potencia tu posicionamiento en la IA con auditorías inteligentes, recomendaciones automáticas y consultoría de expertos.
        </p>

        <div className="home-actions">
          <button
      className="btn-primary"
      onClick={() => router.push("/assistant")}
    >
      Comenzar
    </button>
          <button className="btn-secondary">Ver ejemplo</button>
        </div>

        <div className="home-features">
          <div className="feature-item">
            
            <p>Conviértete en el Top of Mind de la IA</p>
          </div>
          <div className="feature-item">
            
            <p>Descubre cómo hacer que la IA te recomiende</p>
          </div>
          <div className="feature-item">
            
            <p>Conoce las ventajas competitivas en este canal frente a tu competencia</p>
          </div>
        </div>
      </div>

      <div className="home-right">
        {/* Aquí va tu GIF */}
        <div className="gif-wrapper">
          <img
            src="/AI-gif.gif"
            alt="goAISO AI SEO demo"
            className="hero-gif"
          />
        </div>
      </div>
    </div>
  );
}
