import { useState } from "react";
import { getContent, saveContent } from "../store/contentStore";

export default function ContentEditor() {
  const [content, setContent] = useState(getContent());

  const handleSave = () => {
    saveContent(content);
    alert("Salvo!");
  };

  return (
    <div>
      <h2>Editar Site</h2>

      <input
        value={content.heroTitle}
        onChange={(e) => setContent({...content, heroTitle: e.target.value})}
      />

      <button onClick={handleSave}>Salvar</button>
    </div>
  );
}