import ContactButton from "./button";

export default async function Contact() {
    console.log("contact page");
    const res = await fetch("https://jsonplaceholder.typicode.com/posts");
    const posts = await res.json();
    console.log(posts);
    return (
        <div>
            <ContactButton />
        </div>
    );
}