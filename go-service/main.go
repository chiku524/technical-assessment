package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
)

type Student struct {
	ID                 int     `json:"id"`
	Name               string  `json:"name"`
	Email              string  `json:"email"`
	SystemAccess       bool    `json:"systemAccess"`
	Phone              *string `json:"phone"`
	Gender             *string `json:"gender"`
	Dob                *string `json:"dob"`
	Class              *string `json:"class"`
	Section            *string `json:"section"`
	Roll               *int    `json:"roll"`
	FatherName         *string `json:"fatherName"`
	FatherPhone        *string `json:"fatherPhone"`
	MotherName         *string `json:"motherName"`
	MotherPhone        *string `json:"motherPhone"`
	GuardianName       *string `json:"guardianName"`
	GuardianPhone      *string `json:"guardianPhone"`
	RelationOfGuardian *string `json:"relationOfGuardian"`
	CurrentAddress     *string `json:"currentAddress"`
	PermanentAddress   *string `json:"permanentAddress"`
	AdmissionDate      *string `json:"admissionDate"`
	ReporterName       *string `json:"reporterName"`
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func str(v *string) string {
	if v == nil || *v == "" {
		return "N/A"
	}
	return *v
}

func intStr(v *int) string {
	if v == nil {
		return "N/A"
	}
	return fmt.Sprintf("%d", *v)
}

func extractCookies(resp *http.Response) (cookieHeader, csrfToken string) {
	var parts []string
	for _, c := range resp.Cookies() {
		parts = append(parts, fmt.Sprintf("%s=%s", c.Name, c.Value))
		if c.Name == "csrfToken" {
			csrfToken = c.Value
		}
	}
	// Also parse Set-Cookie manually in case cookie jar is used separately
	for _, raw := range resp.Header.Values("Set-Cookie") {
		pair := strings.SplitN(raw, ";", 2)[0]
		parts = append(parts, pair)
		if strings.HasPrefix(pair, "csrfToken=") {
			csrfToken = strings.TrimPrefix(pair, "csrfToken=")
		}
	}
	return strings.Join(unique(parts), "; "), csrfToken
}

func unique(items []string) []string {
	seen := map[string]bool{}
	out := make([]string, 0, len(items))
	for _, item := range items {
		if item == "" || seen[item] {
			continue
		}
		seen[item] = true
		out = append(out, item)
	}
	return out
}

func loginAndAuth(client *http.Client, baseURL string) (cookieHeader, csrfToken string, err error) {
	email := env("NODE_API_USER", "admin@school-admin.com")
	password := env("NODE_API_PASSWORD", "3OU4zn3q6Zh9")

	body, _ := json.Marshal(map[string]string{
		"username": email,
		"password": password,
	})

	req, err := http.NewRequest(http.MethodPost, baseURL+"/api/v1/auth/login", bytes.NewReader(body))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		raw, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("login failed (%d): %s", resp.StatusCode, string(raw))
	}

	cookieHeader, csrfToken = extractCookies(resp)
	if jar := client.Jar; jar != nil {
		u, _ := url.Parse(baseURL)
		var parts []string
		for _, c := range jar.Cookies(u) {
			parts = append(parts, fmt.Sprintf("%s=%s", c.Name, c.Value))
			if c.Name == "csrfToken" {
				csrfToken = c.Value
			}
		}
		if len(parts) > 0 {
			cookieHeader = strings.Join(parts, "; ")
		}
	}

	if cookieHeader == "" || csrfToken == "" {
		return "", "", fmt.Errorf("login succeeded but auth cookies/csrf token missing")
	}
	return cookieHeader, csrfToken, nil
}

func fetchStudent(client *http.Client, baseURL, studentID, cookieHeader, csrfToken string) (*Student, error) {
	req, err := http.NewRequest(http.MethodGet, baseURL+"/api/v1/students/"+studentID, nil)
	if err != nil {
		return nil, err
	}
	if cookieHeader != "" {
		req.Header.Set("Cookie", cookieHeader)
	}
	if csrfToken != "" {
		req.Header.Set("x-csrf-token", csrfToken)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("student fetch failed (%d): %s", resp.StatusCode, string(raw))
	}

	var student Student
	if err := json.Unmarshal(raw, &student); err != nil {
		return nil, err
	}
	return &student, nil
}

func buildPDF(student *Student) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetTitle("Student Report", false)
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 18)
	pdf.Cell(0, 12, "Student Report")
	pdf.Ln(14)

	pdf.SetFont("Arial", "", 11)
	pdf.Cell(0, 8, fmt.Sprintf("Generated: %s", time.Now().Format(time.RFC1123)))
	pdf.Ln(12)

	rows := [][2]string{
		{"Student ID", fmt.Sprintf("%d", student.ID)},
		{"Name", student.Name},
		{"Email", student.Email},
		{"Phone", str(student.Phone)},
		{"Gender", str(student.Gender)},
		{"Date of Birth", str(student.Dob)},
		{"Class", str(student.Class)},
		{"Section", str(student.Section)},
		{"Roll", intStr(student.Roll)},
		{"Father", str(student.FatherName)},
		{"Father Phone", str(student.FatherPhone)},
		{"Mother", str(student.MotherName)},
		{"Mother Phone", str(student.MotherPhone)},
		{"Guardian", str(student.GuardianName)},
		{"Guardian Phone", str(student.GuardianPhone)},
		{"Relation of Guardian", str(student.RelationOfGuardian)},
		{"Current Address", str(student.CurrentAddress)},
		{"Permanent Address", str(student.PermanentAddress)},
		{"Admission Date", str(student.AdmissionDate)},
		{"Reporter", str(student.ReporterName)},
	}

	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(60, 8, "Field")
	pdf.Cell(0, 8, "Value")
	pdf.Ln(9)
	pdf.SetFont("Arial", "", 11)

	for _, row := range rows {
		pdf.Cell(60, 7, row[0])
		pdf.MultiCell(0, 7, row[1], "", "", false)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func handleStudentReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Expected path: /api/v1/students/:id/report
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/students/")
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 2 || parts[1] != "report" || parts[0] == "" {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	studentID := parts[0]

	baseURL := strings.TrimRight(env("NODE_API_URL", "http://localhost:5007"), "/")
	jar, _ := cookiejar.New(nil)
	client := &http.Client{Timeout: 20 * time.Second, Jar: jar}

	cookieHeader := r.Header.Get("Cookie")
	csrfToken := r.Header.Get("x-csrf-token")

	// Prefer forwarded auth; otherwise authenticate as the service account
	if cookieHeader == "" || csrfToken == "" {
		var err error
		cookieHeader, csrfToken, err = loginAndAuth(client, baseURL)
		if err != nil {
			http.Error(w, fmt.Sprintf("unable to authenticate with Node API: %v", err), http.StatusBadGateway)
			return
		}
	}

	student, err := fetchStudent(client, baseURL, studentID, cookieHeader, csrfToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadGateway)
		return
	}

	pdfBytes, err := buildPDF(student)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to generate PDF: %v", err), http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("student-%s-report.pdf", studentID)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(pdfBytes)
}

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

func main() {
	port := env("PORT", "8080")
	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/v1/students/", handleStudentReport)

	addr := ":" + port
	log.Printf("Go PDF report service listening on %s (NODE_API_URL=%s)", addr, env("NODE_API_URL", "http://localhost:5007"))
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
