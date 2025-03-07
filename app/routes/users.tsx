    import { Form, useActionData, useLoaderData, useNavigation  } from "@remix-run/react";
    import { db } from "~/db/client";
    import { users } from "~/db/schema";
    import { eq } from "drizzle-orm";
    import { useState,useEffect } from "react";

    type User = {
        id: number;
        name: string;
        age: number;
        email: string;
      };
      
    type ActionData ={
        success? : string,
        error?: string
    }

    export async function loader () {
        const userList:User[] = await db.select().from(users)
        console.log(userList);
        return userList
    }

    export async function action ({request }: {request: Request}) {
        const formData = await request.formData()
        const intent = formData.get("_intent")

        try {
        if(intent === "create"){
            const newUser = {
                name:formData.get("name") as string,
                age:Number(formData.get("age")),
                email:formData.get("email") as string
            }

            if(!newUser.name || !newUser.email || isNaN(newUser.age)){
                return new Response(JSON.stringify({error: "All fields required"}), { 
                    status: 400,
                    headers: {"Content-Type": "application/json"}
                })}

            await db.insert(users).values(newUser)
            return {success: "User created successfully!"};
            }

        if(intent === "update"){
            const id = Number(formData.get("id"));

            const updateUser = {
                name:formData.get("name") as string,
                age:Number(formData.get("age")),
                email:formData.get("email") as string
            }

            if(!updateUser.name || !updateUser.email || isNaN(updateUser.age)){
                return new Response(JSON.stringify({error: "All fields are required"}), { 
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                });
            }

            await db.update(users).set(updateUser).where(eq(users.id, id));
            return { success: "User updated successfully!" };
            }

        if(intent === "delete"){
            const id = Number(formData.get("id"));

            await db.delete(users).where(eq(users.id, id));
            return { success: "User deleted successfully!" };
            }

            return new Response(JSON.stringify({error: "Invalid action"}), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        } catch(error) {
            return new Response(JSON.stringify({error: "Something went wrong!"}), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }    
    }
        
    export default function Users() {
        const users = useLoaderData<User[]>(); 
        const actionData = useActionData<ActionData>(); 
        const navigation = useNavigation(); 
        const [editUser, setEditUser] = useState<User | null>(null);
      
        useEffect(() => {
          if (actionData?.success) {
            setEditUser(null);
          }
        }, [actionData]);

        // Reset form when navigation state changes (after a successful submission)
  useEffect(() => {
    if (navigation.state === "idle") {
      document.querySelector("form")?.reset(); // Reset form inputs
    }
  }, [navigation.state]);
      
        return (
          <div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-4">Users</h1>
      
            {/* Success & Error Messages */}
            {actionData?.success && <p className="text-green-600 text-center">{actionData.success}</p>}
            {actionData?.error && <p className="text-red-600 text-center">{actionData.error}</p>}
      
            {/* Create & Edit User Form */}
            <Form method="post" className="flex flex-col gap-3 bg-white p-4 rounded-lg shadow">
              {editUser && <input type="hidden" name="id" value={editUser.id} />}
              <input
                type="text"
                name="name"
                defaultValue={editUser?.name || ""}
                placeholder="Enter Name"
                className="p-2 border rounded"
                required
              />
              <input
                type="email"
                name="email"
                defaultValue={editUser?.email || ""}
                placeholder="Enter Email"
                className="p-2 border rounded"
                required
              />
              <input
                type="number"
                name="age"
                defaultValue={editUser?.age || ""}
                placeholder="Enter Age"
                className="p-2 border rounded"
                required
              />
              <button
                type="submit"
                name="_intent"
                value={editUser ? "update" : "create"}
                className={`p-2 rounded text-white ${editUser ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"}`}
              >
                {editUser ? "Update User" : "Add User"}
              </button>
              {editUser && (
                <button type="button" onClick={() => setEditUser(null)} className="bg-gray-400 text-white p-2 rounded hover:bg-gray-500">
                  Cancel
                </button>
              )}
            </Form>
      
            {/* User List */}
            <ul className="mt-4 space-y-4">
              {users.map((user) => (
                <li key={user.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-2">
                  <p className="text-lg font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-600">Age: {user.age}, Email: {user.email}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setEditUser(user)} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
                      Edit
                    </button>
                    <Form method="post">
                      <input type="hidden" name="id" value={user.id} />
                      <button type="submit" name="_intent" value="delete" className="bg-red-500 text-white p-2 rounded hover:bg-red-600">
                        Delete
                      </button>
                    </Form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      }