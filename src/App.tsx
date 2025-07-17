import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

interface Instrument {
  name: string;
}

function App() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);

  useEffect(() => {
    getInstruments();
  }, []);

  async function getInstruments() {
    const { data } = await supabase.from("instruments").select();
    setInstruments(data || []);
  }

  return (
    <ul>
      {instruments.map((instrument) => (
        <li key={instrument.name}>{instrument.name}</li>
      ))}
    </ul>
  );
}

export default App;