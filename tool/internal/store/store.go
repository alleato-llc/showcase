// Package store loads and saves an instance's projects.json. Writes are atomic
// (temp file + rename) and order-preserving, with 2-space indentation and no
// HTML escaping so the file stays diff-friendly and matches the hand-edited form.
package store

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/nycjv321/showcase/tool/internal/model"
)

// ProjectsPath is the projects.json path inside a data directory.
func ProjectsPath(dataDir string) string {
	return filepath.Join(dataDir, "projects.json")
}

// Load reads and parses projects.json from dataDir.
func Load(dataDir string) ([]model.Project, error) {
	path := ProjectsPath(dataDir)
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var projects []model.Project
	if err := json.Unmarshal(b, &projects); err != nil {
		return nil, fmt.Errorf("parsing %s: %w", path, err)
	}
	return projects, nil
}

// Save writes projects.json atomically.
func Save(dataDir string, projects []model.Project) error {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	if err := enc.Encode(projects); err != nil { // Encode adds the trailing newline
		return err
	}

	path := ProjectsPath(dataDir)
	tmp, err := os.CreateTemp(filepath.Dir(path), ".projects-*.json")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	if _, err := tmp.Write(buf.Bytes()); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, path)
}
