export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>
          © {new Date().getFullYear()} goAISO. Todos los derechos reservados.
        </p>

        <div className="footer-links">
          <a href="/privacy">Privacidad</a>
          <a href="/terms">Términos</a>
          <a href="/contact">Contacto</a>
        </div>
      </div>
    </footer>
  );
}
