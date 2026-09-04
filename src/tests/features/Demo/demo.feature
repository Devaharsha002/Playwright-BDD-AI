@PBI_1002 @demo
Feature: CME Demo Experience
  As a prospective operations analyst
  I want to interact with demo widgets and preview CME workflows
  So that I can explore features safely

  @TC_2002 @demo
  Scenario: Navigate through demo onboarding and verify widgets
    Given the user is on the CME landing dashboard
    When the user navigates to "Demo Sandbox"
    Then the demo sandbox status should be "Active"
    And the user takes a screenshot named "demo_sandbox_verified"
