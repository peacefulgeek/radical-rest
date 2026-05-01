import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Tools from './pages/Tools';
import Privacy from './pages/Privacy';
import Assessments from './pages/Assessments';
import Article from './pages/Article';
import NotFound from './pages/NotFound';
import './styles/global.css';

export default function App({ data }: { data: any }) {
  let main: React.ReactNode;
  switch (data?.route) {
    case 'home':
      main = <Home data={data} />; break;
    case 'about':
      main = <About />; break;
    case 'tools':
      main = <Tools />; break;
    case 'privacy':
      main = <Privacy />; break;
    case 'assessments':
      main = <Assessments />; break;
    case 'article':
      main = <Article data={data} />; break;
    default:
      main = <NotFound />;
  }
  return (
    <>
      <Header />
      <main className="rr-main">{main}</main>
      <Footer />
    </>
  );
}
