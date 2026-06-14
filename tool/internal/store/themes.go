package store

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/nycjv321/showcase/tool/internal/model"
)

// ThemesPath is the themes.json path inside a data directory.
func ThemesPath(dataDir string) string {
	return filepath.Join(dataDir, "themes.json")
}

// LoadThemes reads themes.json from dataDir.
func LoadThemes(dataDir string) (model.ThemeSettings, error) {
	var s model.ThemeSettings
	b, err := os.ReadFile(ThemesPath(dataDir))
	if err != nil {
		return s, err
	}
	if err := json.Unmarshal(b, &s); err != nil {
		return s, fmt.Errorf("parsing %s: %w", ThemesPath(dataDir), err)
	}
	return s, nil
}

// SaveThemes writes themes.json atomically.
func SaveThemes(dataDir string, s model.ThemeSettings) error {
	return writeJSON(ThemesPath(dataDir), s)
}
