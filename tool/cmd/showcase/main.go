// Command showcase edits a showcase instance's projects.json from the terminal.
// It shares the model + store packages with the (forthcoming) Wails GUI.
package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/nycjv321/showcase/tool/internal/model"
	"github.com/nycjv321/showcase/tool/internal/store"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}
	var err error
	switch os.Args[1] {
	case "list", "ls":
		err = cmdList(os.Args[2:])
	case "add":
		err = cmdAdd(os.Args[2:])
	case "edit":
		err = cmdEdit(os.Args[2:])
	case "rm", "remove":
		err = cmdRm(os.Args[2:])
	case "move", "mv":
		err = cmdMove(os.Args[2:])
	case "validate", "check":
		err = cmdValidate(os.Args[2:])
	case "fmt", "format":
		err = cmdFmt(os.Args[2:])
	case "-h", "--help", "help":
		usage()
		return
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", os.Args[1])
		usage()
		os.Exit(2)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func usage() {
	fmt.Fprint(os.Stderr, `showcase — edit a showcase instance's projects.json

Usage: showcase <command> [--data DIR] [flags]
  DIR defaults to $SHOWCASE_DATA, else examples/default

Commands:
  list                                      list projects
  add  [--title --emoji --headline          add a project
        --site --repo --at N]               (prompts for anything omitted)
  edit <index>                              edit a project interactively
  rm   <index> [--yes]                      remove a project
  move <from> <to>                          reorder a project
  validate                                  validate projects.json
  fmt                                       rewrite projects.json in canonical form
`)
}

// newFlags returns a FlagSet pre-wired with the shared --data flag.
func newFlags(name string) (*flag.FlagSet, *string) {
	fs := flag.NewFlagSet(name, flag.ExitOnError)
	def := os.Getenv("SHOWCASE_DATA")
	if def == "" {
		def = "examples/default"
	}
	data := fs.String("data", def, "instance data directory (holding projects.json)")
	return fs, data
}

func cmdList(args []string) error {
	fs, data := newFlags("list")
	_ = fs.Parse(args)
	projects, err := store.Load(*data)
	if err != nil {
		return err
	}
	if len(projects) == 0 {
		fmt.Println("(no projects)")
		return nil
	}
	for i, p := range projects {
		fmt.Printf("%2d  %s  %s\n        %s\n        %s\n", i+1, p.Emoji, p.Title, p.Headline, linkSummary(p))
	}
	return nil
}

func cmdValidate(args []string) error {
	fs, data := newFlags("validate")
	_ = fs.Parse(args)
	projects, err := store.Load(*data)
	if err != nil {
		return err
	}
	if errs := model.Validate(projects); len(errs) > 0 {
		for _, e := range errs {
			fmt.Fprintln(os.Stderr, " ✗", e)
		}
		return fmt.Errorf("%d validation error(s)", len(errs))
	}
	fmt.Printf("✓ %d project(s) valid\n", len(projects))
	return nil
}

func cmdFmt(args []string) error {
	fs, data := newFlags("fmt")
	_ = fs.Parse(args)
	projects, err := store.Load(*data)
	if err != nil {
		return err
	}
	if err := store.Save(*data, projects); err != nil {
		return err
	}
	fmt.Printf("✓ formatted %s (%d project(s))\n", store.ProjectsPath(*data), len(projects))
	return nil
}

func cmdAdd(args []string) error {
	fs, data := newFlags("add")
	title := fs.String("title", "", "project title")
	emoji := fs.String("emoji", "", "single emoji")
	headline := fs.String("headline", "", "one-line description")
	site := fs.String("site", "", "live site URL")
	repo := fs.String("repo", "", "source repo URL")
	at := fs.Int("at", 0, "1-based insert position (default: append)")
	_ = fs.Parse(args)

	r := bufio.NewReader(os.Stdin)
	p := model.Project{Title: *title, Emoji: *emoji, Headline: *headline, Site: *site, Repo: *repo}
	if p.Title == "" {
		p.Title = prompt(r, "Title")
	}
	if p.Emoji == "" {
		p.Emoji = prompt(r, "Emoji")
	}
	if p.Headline == "" {
		p.Headline = prompt(r, "Headline")
	}
	if p.Site == "" {
		p.Site = prompt(r, "Live site URL (optional)")
	}
	if p.Repo == "" {
		p.Repo = prompt(r, "Source repo URL (optional)")
	}
	if errs := p.Validate(0); len(errs) > 0 {
		for _, e := range errs {
			fmt.Fprintln(os.Stderr, " ✗", e)
		}
		return fmt.Errorf("project is invalid")
	}

	projects, err := store.Load(*data)
	if err != nil {
		return err
	}
	pos := len(projects)
	if *at >= 1 && *at <= len(projects)+1 {
		pos = *at - 1
	}
	projects = insert(projects, pos, p)
	if err := store.Save(*data, projects); err != nil {
		return err
	}
	fmt.Printf("✓ added %q at position %d (%d total)\n", p.Title, pos+1, len(projects))
	return nil
}

func cmdEdit(args []string) error {
	fs, data := newFlags("edit")
	pos := parseArgs(fs, args)
	projects, err := store.Load(*data)
	if err != nil {
		return err
	}
	i, err := parseIndex(at(pos, 0), len(projects))
	if err != nil {
		return err
	}
	r := bufio.NewReader(os.Stdin)
	p := projects[i]
	fmt.Printf("Editing #%d — press Enter to keep the current value.\n", i+1)
	p.Title = promptDefault(r, "Title", p.Title)
	p.Emoji = promptDefault(r, "Emoji", p.Emoji)
	p.Headline = promptDefault(r, "Headline", p.Headline)
	p.Site = promptDefault(r, "Live site URL", p.Site)
	p.Repo = promptDefault(r, "Source repo URL", p.Repo)
	if errs := p.Validate(i); len(errs) > 0 {
		for _, e := range errs {
			fmt.Fprintln(os.Stderr, " ✗", e)
		}
		return fmt.Errorf("project is invalid")
	}
	projects[i] = p
	if err := store.Save(*data, projects); err != nil {
		return err
	}
	fmt.Printf("✓ updated %q\n", p.Title)
	return nil
}

func cmdRm(args []string) error {
	fs, data := newFlags("rm")
	yes := fs.Bool("yes", false, "skip confirmation")
	pos := parseArgs(fs, args)
	projects, err := store.Load(*data)
	if err != nil {
		return err
	}
	i, err := parseIndex(at(pos, 0), len(projects))
	if err != nil {
		return err
	}
	title := projects[i].Title
	if !*yes {
		r := bufio.NewReader(os.Stdin)
		fmt.Printf("Remove #%d %q? [y/N]: ", i+1, title)
		ans, _ := r.ReadString('\n')
		if strings.ToLower(strings.TrimSpace(ans)) != "y" {
			fmt.Println("aborted")
			return nil
		}
	}
	projects = append(projects[:i], projects[i+1:]...)
	if err := store.Save(*data, projects); err != nil {
		return err
	}
	fmt.Printf("✓ removed %q (%d remaining)\n", title, len(projects))
	return nil
}

func cmdMove(args []string) error {
	fs, data := newFlags("move")
	pos := parseArgs(fs, args)
	projects, err := store.Load(*data)
	if err != nil {
		return err
	}
	from, err := parseIndex(at(pos, 0), len(projects))
	if err != nil {
		return fmt.Errorf("from: %w", err)
	}
	to, err := parseIndex(at(pos, 1), len(projects))
	if err != nil {
		return fmt.Errorf("to: %w", err)
	}
	p := projects[from]
	projects = append(projects[:from], projects[from+1:]...)
	projects = insert(projects, to, p)
	if err := store.Save(*data, projects); err != nil {
		return err
	}
	fmt.Printf("✓ moved %q to position %d\n", p.Title, to+1)
	return nil
}

// --- helpers ---

func insert(s []model.Project, at int, p model.Project) []model.Project {
	if at < 0 {
		at = 0
	}
	if at > len(s) {
		at = len(s)
	}
	s = append(s, model.Project{})
	copy(s[at+1:], s[at:])
	s[at] = p
	return s
}

// parseArgs parses flags that may be interspersed with positional args (Go's
// flag package otherwise stops at the first positional), returning the
// positionals in order.
func parseArgs(fs *flag.FlagSet, args []string) []string {
	var positionals []string
	for {
		_ = fs.Parse(args)
		if fs.NArg() == 0 {
			return positionals
		}
		positionals = append(positionals, fs.Arg(0))
		args = fs.Args()[1:]
	}
}

func at(s []string, i int) string {
	if i < len(s) {
		return s[i]
	}
	return ""
}

func parseIndex(arg string, n int) (int, error) {
	if arg == "" {
		return 0, fmt.Errorf("an index (1..%d) is required", n)
	}
	v, err := strconv.Atoi(arg)
	if err != nil || v < 1 || v > n {
		return 0, fmt.Errorf("index must be 1..%d, got %q", n, arg)
	}
	return v - 1, nil
}

func prompt(r *bufio.Reader, label string) string {
	fmt.Printf("%s: ", label)
	s, _ := r.ReadString('\n')
	return strings.TrimSpace(s)
}

func promptDefault(r *bufio.Reader, label, def string) string {
	fmt.Printf("%s [%s]: ", label, def)
	s, _ := r.ReadString('\n')
	if s = strings.TrimSpace(s); s == "" {
		return def
	}
	return s
}

func linkSummary(p model.Project) string {
	var parts []string
	if p.Site != "" {
		parts = append(parts, "live ↗ "+p.Site)
	}
	if p.Repo != "" {
		parts = append(parts, "src "+p.Repo)
	}
	for _, l := range p.Links {
		parts = append(parts, l.Label+" "+l.URL)
	}
	for _, im := range p.Implementations {
		switch {
		case im.Site != "" && im.Repo != "":
			parts = append(parts, im.Label+" (live+src)")
		case im.Site != "":
			parts = append(parts, im.Label+" (live)")
		case im.Repo != "":
			parts = append(parts, im.Label+" (src)")
		default:
			parts = append(parts, im.Label)
		}
	}
	if len(parts) == 0 {
		return "(no links)"
	}
	return strings.Join(parts, "  ·  ")
}
