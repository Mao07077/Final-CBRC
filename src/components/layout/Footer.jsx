const Footer = () => {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="container mx-auto px-6 py-8 text-center">
        <img
          src="/cbrc_logo.png"
          alt="CBRC Logo"
          className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 mx-auto mb-4"
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
