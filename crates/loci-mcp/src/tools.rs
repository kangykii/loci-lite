use loci_core::atoms::{self, AtomRecord, AtomUpdate, NewAtom};
use loci_core::files;
use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::{Json, Parameters};
use rmcp::model::{ServerCapabilities, ServerInfo};
use rmcp::{tool, tool_handler, tool_router, ServerHandler};
use schemars::JsonSchema;
use serde::Deserialize;
use sqlx::SqlitePool;

#[derive(Debug, Clone)]
pub struct LociMcp {
    pool: SqlitePool,
    tool_router: ToolRouter<Self>,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ListAtomsRequest {
    /// Restrict to atoms belonging to this file id (from `list_files`).
    pub file_id: Option<String>,
    /// Restrict to one atom type: "definition", "note", or "reminder".
    #[serde(rename = "type")]
    pub atom_type: Option<String>,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct SearchAtomsRequest {
    /// Substring to search for across each atom's question, answer, and source text.
    pub query: String,
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct AtomIdRequest {
    pub id: String,
}

#[derive(Debug, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAtomRequest {
    pub id: String,
    #[serde(rename = "type")]
    pub atom_type: String,
    pub answer: String,
    #[serde(default)]
    pub source_text: Option<String>,
    #[serde(default)]
    pub reminder_due_at: Option<i64>,
}

impl LociMcp {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool,
            tool_router: Self::tool_router(),
        }
    }
}

#[tool_router(router = tool_router)]
impl LociMcp {
    #[tool(description = "List every markdown file Loci-Lite knows about (id, path, title, pinned).")]
    async fn list_files(&self) -> Result<Json<Vec<files::FileRecord>>, String> {
        files::list_all_files(&self.pool)
            .await
            .map(Json)
            .map_err(|error| error.to_string())
    }

    #[tool(
        description = "List bookmarks (\"atoms\") - reusable notes/definitions/reminders tied to spans of a file - optionally filtered by file id or atom type."
    )]
    async fn list_atoms(
        &self,
        Parameters(ListAtomsRequest { file_id, atom_type }): Parameters<ListAtomsRequest>,
    ) -> Result<Json<Vec<AtomRecord>>, String> {
        atoms::list_atoms(&self.pool, file_id.as_deref(), atom_type.as_deref())
            .await
            .map(Json)
            .map_err(|error| error.to_string())
    }

    #[tool(description = "Search bookmark (atom) question/answer/source text for a substring.")]
    async fn search_atoms(
        &self,
        Parameters(SearchAtomsRequest { query }): Parameters<SearchAtomsRequest>,
    ) -> Result<Json<Vec<AtomRecord>>, String> {
        atoms::search_atoms(&self.pool, &query)
            .await
            .map(Json)
            .map_err(|error| error.to_string())
    }

    #[tool(description = "Fetch a single bookmark (atom) by id, including its file's path.")]
    async fn get_atom(
        &self,
        Parameters(AtomIdRequest { id }): Parameters<AtomIdRequest>,
    ) -> Result<Json<Option<AtomRecord>>, String> {
        atoms::get_atom_by_id(&self.pool, &id)
            .await
            .map(Json)
            .map_err(|error| error.to_string())
    }

    #[tool(
        description = "Create a bookmark (atom) - a reusable note/definition/reminder attached to a span of a file. type is one of \"definition\", \"note\", \"reminder\"."
    )]
    async fn create_atom(
        &self,
        Parameters(input): Parameters<NewAtom>,
    ) -> Result<Json<AtomRecord>, String> {
        atoms::create_atom(&self.pool, input)
            .await
            .map(Json)
            .map_err(|error| error.to_string())
    }

    #[tool(description = "Update an existing bookmark (atom)'s type/answer/source text/reminder.")]
    async fn update_atom(
        &self,
        Parameters(UpdateAtomRequest {
            id,
            atom_type,
            answer,
            source_text,
            reminder_due_at,
        }): Parameters<UpdateAtomRequest>,
    ) -> Result<Json<AtomRecord>, String> {
        let patch = AtomUpdate {
            atom_type,
            answer,
            source_text,
            reminder_due_at,
        };
        atoms::update_atom(&self.pool, &id, patch)
            .await
            .map_err(|error| error.to_string())?
            .map(Json)
            .ok_or_else(|| format!("Atom {id} not found (it may have been deleted)."))
    }

    #[tool(description = "Delete a bookmark (atom) by id.")]
    async fn delete_atom(
        &self,
        Parameters(AtomIdRequest { id }): Parameters<AtomIdRequest>,
    ) -> Result<(), String> {
        atoms::delete_atom(&self.pool, &id)
            .await
            .map_err(|error| error.to_string())
    }
}

#[tool_handler(router = self.tool_router)]
impl ServerHandler for LociMcp {
    fn get_info(&self) -> ServerInfo {
        ServerInfo::new(ServerCapabilities::builder().enable_tools().build()).with_instructions(
            "Read/write access to Loci-Lite's bookmarks (\"atoms\") and files. \
             Atoms are reusable annotations - definitions, notes, reminders - attached to spans \
             of a markdown file; use search_atoms/list_atoms to find existing ones before \
             creating new content elsewhere.",
        )
    }
}
