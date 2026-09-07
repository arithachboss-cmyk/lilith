import { foundationCopy } from "@lilith/i18n";

export default function FoundationPage() {
  return (
    <main>
      <p className="brand">
        LILITH <span>by THE MIDDLE</span>
      </p>
      <p className="status">ARCH-001 · Foundation</p>
      <h1>{foundationCopy.th.title}</h1>
      <p>{foundationCopy.th.description}</p>
      <p lang="en">{foundationCopy.en.description}</p>
    </main>
  );
}
