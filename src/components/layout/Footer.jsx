const Footer = () => {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="container mx-auto px-6 py-8 text-center">
        <img
          src="/cbrc_logo.png"
          alt="CBRCS Logo"
          className="h-12 w-12 mx-auto mb-4"
        />
        <p>
          &copy; {new Date().getFullYear()} Dr. Carl Balita Review Center. All
          Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
