export function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Створіть подію",
      text: "Назва, час за Києвом, скільки місць, обкладинка. Публічна — на головній, приватна — лише за лінком.",
    },
    {
      n: "2",
      title: "Запросіть людей",
      text: "Скопіюйте посилання-запрошення. Автор бачить список учасників з email і може редагувати чи видалити подію.",
    },
    {
      n: "3",
      title: "Натисніть «Іду»",
      text: "Місце бронюється одразу. Скасування звільняє місце. Коментарі — звичайний текст, без HTML.",
    },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-3" aria-labelledby="how-heading">
      <h2 id="how-heading" className="sr-only">
        Як це працює
      </h2>
      {steps.map((step) => (
        <article key={step.n} className="rounded-3xl border border-line bg-cream/80 p-5">
          <p className="display text-ember text-2xl">{step.n}</p>
          <h3 className="mt-2 font-semibold">{step.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{step.text}</p>
        </article>
      ))}
    </section>
  );
}
