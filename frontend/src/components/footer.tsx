import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="flex justify-center items-center gap-12 py-1 border-t">
      <Link
        to="/the-boring-stuff"
        className="text-sm text-muted-foreground hover:text-personality transition-colors"
      >
        The boring stuff - Privacy Policy & ToS
      </Link>
      <div className="flex justify-center gap-2 items-center">
        <span className="font-300 text-lg text-muted-foreground">
          Built by{" "}
          <a
            href="https://ob248.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-personality font-700"
          >
            Oliver Bryan
          </a>
        </span>
        <a href="https://ob248.com" target="_blank" rel="noopener noreferrer">
          <img src="oliver-bryan.svg" alt="Oliver Bryan" className="w-4 h-4" />
        </a>
      </div>
    </footer>
  );
}
