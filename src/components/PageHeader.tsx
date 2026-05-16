export function PageHeader({ title }: { title: string }) {
  return (
    <section className="h-[300px] sm:h-[436px] flex justify-center items-center px-4">
      <h1 className="text-[28px] sm:text-4xl font-bold uppercase text-center">
        {title}
      </h1>
    </section>
  )
}
