import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="navbar">
      <ul className="nav-links">
       
        <li>
          <a href="/useCase">Casos de uso</a>
        </li>
       
      </ul>
    <Link href="/assistant">
    <button className="nav-cta">Comenzar</button>
    </Link>
      
    </nav>
  );
}
