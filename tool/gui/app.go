package main

import (
	"context"
	"os"

	"github.com/nycjv321/showcase/tool/internal/model"
	"github.com/nycjv321/showcase/tool/internal/store"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the Wails backend. Every method here is bound and callable from the
// TypeScript frontend; they all go through the same model + store packages the
// CLI uses, so the two tools behave identically.
type App struct {
	ctx     context.Context
	dataDir string
}

func NewApp() *App {
	dir := os.Getenv("SHOWCASE_DATA")
	if dir == "" {
		dir = "examples/default"
	}
	return &App{dataDir: dir}
}

func (a *App) startup(ctx context.Context) { a.ctx = ctx }

// DataDir reports the instance folder currently being edited.
func (a *App) DataDir() string { return a.dataDir }

// ChooseDataDir opens a native folder picker and switches the active instance.
func (a *App) ChooseDataDir() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Choose a showcase instance folder (with projects.json)",
	})
	if err != nil || dir == "" {
		return a.dataDir, err
	}
	a.dataDir = dir
	return dir, nil
}

// List loads the instance's projects.
func (a *App) List() ([]model.Project, error) { return store.Load(a.dataDir) }

// Save writes the projects back (atomic, canonical formatting).
func (a *App) Save(projects []model.Project) error { return store.Save(a.dataDir, projects) }

// Validate returns human-readable problems (empty == valid).
func (a *App) Validate(projects []model.Project) []string {
	errs := model.Validate(projects)
	out := make([]string, 0, len(errs))
	for _, e := range errs {
		out = append(out, e.Error())
	}
	return out
}

// LoadThemes loads the instance's themes.json.
func (a *App) LoadThemes() (model.ThemeSettings, error) { return store.LoadThemes(a.dataDir) }

// SaveThemes writes themes.json back (atomic).
func (a *App) SaveThemes(s model.ThemeSettings) error { return store.SaveThemes(a.dataDir, s) }

// ValidateThemes returns human-readable problems (empty == valid).
func (a *App) ValidateThemes(s model.ThemeSettings) []string {
	errs := s.Validate()
	out := make([]string, 0, len(errs))
	for _, e := range errs {
		out = append(out, e.Error())
	}
	return out
}
