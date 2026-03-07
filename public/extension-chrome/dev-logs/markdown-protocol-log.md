# Dev Log: Markdown Protocol & Syntactic Sugar

## Overview
The Markdown Protocol & Syntactic Sugar is the communication layer between the Central Command (CC) and the AI Studio session. It defines the rules and tags that the AI uses to control its workflow, manage memory, and orchestrate the puppet agents.

## Recent Updates (v5.0 to v6.0)
- **Evolved Protocol:** Upgraded the markdown-based procedures to support the new CC and puppet agent architecture.
- **New Tags:** Introduced `<PUPPET_DEPLOY>` and `<PUPPET_COMMAND>` tags to allow the AI to deploy the puppet agent to specific URLs and execute commands.
- **Enhanced Parsing:** Improved the parsing logic in `background.js` to handle the new tags and extract the necessary information (URL, command).
- **System Injection:** Added `[SYSTEM: PUPPET RECON REPORT]` tags to inject the results of the puppet agent's execution back into the AI Studio session.

## Future Goals
- **Complex Sequences:** Introduce tags to define and execute complex, multi-step sequences or loops (e.g., `<SEQUENCE>`, `<LOOP>`).
- **Conditional Logic:** Add support for conditional tags (e.g., `<IF condition>`, `<THEN>`, `<ELSE>`) to allow the AI to make decisions based on the puppet agent's reports.
- **Data Formatting:** Implement tags to request specific data formats from the puppet agent (e.g., `<FORMAT type="json">`).
- **Error Handling:** Introduce tags to handle errors and exceptions gracefully (e.g., `<ON_ERROR action="retry">`).
