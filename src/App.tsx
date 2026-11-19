import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Map from './components/Map';
import Admin from './components/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
