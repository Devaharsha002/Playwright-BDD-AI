@PBI_1001 @cme @regression
Feature: CME Corporate Account Management
  As a CME Operations Officer
  I want to create and validate commercial corporate profiles
  So that onboarding compliance standards are verified

  Background:
    Given the user is logged in as "StandardUser"
    And the user is on the CME landing dashboard

  @TC_2001 @smoke
  Scenario: Create a new corporate account with standard risk rating
    When the user navigates to "CME Customer Onboarding"
    And the user fills in corporate account information:
      | Field            | Value                         |
      | Company Name     | Alpha Enterprise Holdings Inc |
      | Registration No  | 9876543210                    |
      | Country          | United Kingdom                |
    And the user selects risk rating "Standard"
    And the user submits the registration form
    Then the system displays a confirmation notification
    And the account status should display "Pending Approval"
