# Step 03: Primitive review

## Feature map

| Server feature | MCP primitive | Why it belongs there |
| --- | --- | --- |
| `list_notes` | Tool | The model can call it when it needs a compact, paginated list of note IDs and metadata. Its cursor and limit are model-selected arguments. |
| `get_note` | Tool | The model can choose a note ID and fetch the full note during a task. It is a read-only operation, but it is still useful as a model-controlled action. |
| `create_note` | Tool | Saving data changes server state, so the model invokes it only when the user asks to save a note. |
| `delete_note` | Tool | Deletion changes server state and needs a specific note ID. The destructive operation is correctly exposed as a tool. |
| `note://{id}` template and each note URI | Resource | Notes are read-only context that the host or user can browse and attach. `resources/list` enumerates them; `resources/read` returns the title and body. |
| `summarize_notes` | Prompt | It is a repeatable workflow the user explicitly chooses. Its message directs the model to use `list_notes` and read relevant notes through `get_note` or the resource URI. |
| `draft_note_from_meeting` | Prompt | It packages a repeatable meeting-to-draft workflow that the user starts with meeting text. The prompt asks the model to consult existing notes and draft content, while leaving saving to the `create_note` tool after user approval. |
| `notifications/resources/list_changed` after create/delete | Notification, not a primitive | It tells subscribed clients that the resource catalog changed. It does not read or write a note and does not replace the create/delete tools. |
| KV storage, note schemas, UUID validation, `/mcp` route, and handler setup | Implementation support, not primitives | These support persistence, validation, and transport; clients do not invoke them as tools, resources, or prompts. |

## What might move?

Nothing needs to move to another primitive. The split fits the user experience: tools perform model-selected actions, resources make note text available for deliberate context selection, and prompts are user-selected starting points for recurring workflows.

There is some intentional overlap between `get_note` and `note://{id}`, and between `list_notes` and `resources/list`. Keep both for this learning step: the tools give the model compact, argument-driven access, while resources let a host or user browse and attach context directly. Avoid adding separate read tools that only duplicate the resource interface without a distinct model-controlled use.

The `summarize_notes` prompt accepts an optional `tag`, but the current note schema has no tag field. It currently treats that value as a topic matched against titles and contents. If formal tag filtering is required, add and maintain tags on notes first; otherwise, consider renaming the argument to `topic` so its behavior is clear.

Keep saving and deletion in tools. A prompt should only assemble instructions and messages, and a resource should remain read-only.
