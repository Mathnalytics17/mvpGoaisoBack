"use client"
import Image from "next/image";
import Navbar from "./NavBar";
import Link from "next/link";

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <Link href="/" >
        <div className="logo">
          <Image
            src="/Logo-goaiso.png"
            alt="goAISO logo"
            width={120}
            height={40}
            priority
          />
        </div>
        </Link>
        

        <Navbar />
      </div>
    </header>
  );
}
